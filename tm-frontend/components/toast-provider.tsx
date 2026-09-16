"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      theme="dark"
      toastClassName="!rounded-xl !border !border-white/10 !bg-[#111111] !text-white"
      progressClassName="!bg-white"
    />
  );
}
