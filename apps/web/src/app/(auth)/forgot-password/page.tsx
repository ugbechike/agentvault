import type { Metadata } from "next";

import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

const ForgotPasswordPage = () => <ForgotForm />;

export default ForgotPasswordPage;
