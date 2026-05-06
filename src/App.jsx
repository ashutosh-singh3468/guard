import { useCallback, useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import OrderDetails from './components/OrderDetails';
import QrScanner from './components/QrScanner';
import { loginGuard, scanOrderByNumber, setAuthToken, getUserOrders } from './api';

const TOKEN_KEY = 'guard_token';

function parseOrderNumber(rawValue) {
  if (!rawValue) return '';

  try {
    const maybeJson = JSON.parse(rawValue);
    if (typeof maybeJson === 'string') return maybeJson;
    if (maybeJson.order_number) return maybeJson.order_number;
  } catch {
    // treat as plain text
  }

  return String(rawValue).trim();
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [order, setOrder] = useState(null);
  const [scannedText, setScannedText] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [allUserItems, setAllUserItems] = useState([]);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const handleLogin = async ({ email, password }) => {
    setLoginError('');
    setLoginLoading(true);

    try {
      const result = await loginGuard(email, password);
      const authToken = result?.tokens?.access || '';

      if (!authToken) {
        throw new Error('No token in login response');
      }

      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    } catch (error) {
      setLoginError(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchOrder = useCallback(async (rawQrText) => {
    if (scanning) return;

    const orderNumber = parseOrderNumber(rawQrText);

    // ✅ QR validation
    if (!orderNumber || !orderNumber.startsWith("SQORD-")) {
      setScanError('Invalid QR code format.');
      return;
    }

    setScanning(true);
    setScanError('');

    try {
      const result = await scanOrderByNumber(orderNumber);

      console.log("API RESPONSE:", result); // 🔥 Debug

      // ✅ Normalize response (handles all backend formats)
      const normalizedOrder =
        result?.data?.order ||
        result?.data ||
        result?.order ||
        result;

      if (!normalizedOrder || !normalizedOrder.order_number) {
        throw new Error("Invalid order data received");
      }

      // ✅ Ensure items always exist
      normalizedOrder.items =
        normalizedOrder.items ||
        normalizedOrder.order_items ||
        [];

      setOrder(normalizedOrder);
      setScannerActive(false); // Stop scanner after successful scan

      // Fetch all user items
      const userId = normalizedOrder.user.id;
      try {
        const userOrdersResponse = await getUserOrders(userId);
        const userOrders = userOrdersResponse.data || userOrdersResponse;
        const allItems = userOrders.flatMap(o => o.items || []);
        setAllUserItems(allItems);
      } catch (error) {
        console.error('Failed to fetch user orders:', error);
        // Still show the order items if user orders fail
        setAllUserItems(normalizedOrder.items || []);
      }

    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Could not fetch order details.';

      setScanError(message);
      setOrder(null);
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setOrder(null);
    setScanError('');
    setScannedText('');
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4">
        <LoginForm onLogin={handleLogin} loading={loginLoading} error={loginError} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Guard Order Verification
            </h1>
            <p className="text-sm text-slate-600">
              Authenticated guard portal for order QR scan.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Logout
          </button>
        </header>

        {/* QR SCANNER */}
        <QrScanner
          active={scannerActive}
          scanning={scanning}
          onScanned={fetchOrder}
          onToggle={() => setScannerActive((prev) => !prev)}
          onError={(errorMessage) => {
            if (!errorMessage?.includes?.('NotFoundException')) {
              // setScanError('Scanner error. Please check camera access.');
            }
          }}
        />

        {/* LOADING */}
        {scanning && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Fetching order details...
          </p>
        )}

        {/* ERROR */}
        {scanError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {scanError}
          </p>
        )}

        {/* SCANNED TEXT */}
        {scannedText && !scanning && (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Scanned QR: <span className="font-mono">{scannedText}</span>
          </p>
        )}

        {/* ORDER DETAILS */}
        <OrderDetails order={order} allUserItems={allUserItems} />

      </div>
    </main>
  );
}