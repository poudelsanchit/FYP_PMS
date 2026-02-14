'use client'
import { Button } from '@/core/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

const SignoutButtton = () => {
    return (
        <Button onClick={() => signOut()} className="w-full" size="lg">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
        </Button>
    )
}

export default SignoutButtton