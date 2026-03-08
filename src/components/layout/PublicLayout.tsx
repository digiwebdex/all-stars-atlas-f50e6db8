import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "@/components/ScrollToTop";
import PageProgressBar from "@/components/PageProgressBar";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PageProgressBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default PublicLayout;
