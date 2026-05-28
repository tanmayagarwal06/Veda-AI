import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-veda-gray-50 overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col ml-[228px] min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
