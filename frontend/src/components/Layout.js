import Header from "./Header/Header";

function Layout({ children }) { 
  return (
    <div className="Layout">
        <Header />
        <main>
            {children}
        </main>
    </div>
  );
}

export default Layout;