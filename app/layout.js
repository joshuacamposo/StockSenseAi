import './globals.css';
import { AppProvider } from '@/context/AppProvider';
import { WalkthroughProvider } from '@/context/WalkthroughContext';
import { ChatbotProvider } from '@/context/ChatbotContext';
import AppToaster from '@/components/ui/AppToaster';

export const metadata = {
  title: 'StockSense AI — Inventory & Stock Management Automation',
  description:
    'StockSense AI is an interactive academic prototype for inventory management, automated low-stock detection, reorder recommendations, forecasting, and a built-in rule-based AI assistant.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <WalkthroughProvider>
            <ChatbotProvider>
              {children}
              <AppToaster />
            </ChatbotProvider>
          </WalkthroughProvider>
        </AppProvider>
      </body>
    </html>
  );
}
