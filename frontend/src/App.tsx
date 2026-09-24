import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import HomePage from "./pages/Home";
import AboutPage from "./pages/About";
import ExecutivesPage from "./pages/Executives";
import NewsPage from "./pages/News";
import NewsDetailPage from "./pages/NewsDetail";
import BlogsPage from "./pages/Blogs";
import BlogDetailPage from "./pages/BlogDetail";
import GalleryPage from "./pages/Gallery";
import ContactPage from "./pages/Contact";
import RegisterPage from "./pages/Register";
import AuditPage from "./pages/Audit";
import NotFoundPage from "./pages/NotFound";
import AdminLayout from "./pages/admin/Layout";
import AdminLoginPage from "./pages/admin/Login";
import DashboardPage from "./pages/admin/Dashboard";
import PaymentsPage from "./pages/admin/Payments";
import AccountPage from "./pages/admin/Account";
import NewsAdminPage from "./pages/admin/News";
import BlogsAdminPage from "./pages/admin/Blogs";
import GalleryAdminPage from "./pages/admin/GalleryAdmin";
import AdminExecutivesPage from "./pages/admin/AdminExecutives";
import DocumentsPage from "./pages/admin/Documents";
import MessagesPage from "./pages/admin/Messages";
import SettingsPage from "./pages/admin/Settings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/executives" element={<ExecutivesPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:id" element={<BlogDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminLoginPage />} />
            <Route path="login" element={<AdminLoginPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="content/news" element={<NewsAdminPage />} />
            <Route path="content/blogs" element={<BlogsAdminPage />} />
            <Route path="content/gallery" element={<GalleryAdminPage />} />
            <Route path="executives" element={<AdminExecutivesPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      {!location.pathname.startsWith("/admin") && <ChatWidget />}
    </div>
  );
}
