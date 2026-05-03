import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import PageTransition from './PageTransition';

const Layout = ({ title, children }) => {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default Layout;