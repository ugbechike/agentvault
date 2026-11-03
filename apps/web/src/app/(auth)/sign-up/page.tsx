import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Sign up" };

const SignUpPage = () => <SignUpForm />;

export default SignUpPage;
