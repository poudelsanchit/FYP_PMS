'use client'
import { Button } from "@/core/components/ui/button"
import { signIn } from "next-auth/react"
import { FcGoogle } from "react-icons/fc";

const Login = () => {
    return (
        <div className="flex  h-screen justify-center items-center">
            <Button onClick={() => {
                signIn('google')
            }}>
                <FcGoogle />
                Login With Google
            </Button>
        </div>)
}

export default Login