import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  const location = useLocation()
  const hideNavbar = location.pathname === '/role-selection';
  return (
    <div className='min-h-screen bg-slate-800'>
      {!hideNavbar && <Navbar />}
      <Outlet />
    </div>
  );
};

export default MainLayout;