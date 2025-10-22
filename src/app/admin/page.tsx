import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import AdminDashboardClient from "./AdminDashboardClient";

async function Adminpage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = user.emailAddresses[0]?.emailAddress;

  //user is not admin, redirect to dashboard
  if (!adminEmail || userEmail !== adminEmail) redirect("/dashboard");

  return <AdminDashboardClient />;
}

export default Adminpage;
