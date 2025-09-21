// resources/js/components/UserDropdown.jsx
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

export function UserDropdown({ user }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors focus:outline-none">
                    {user.name}
                    <ChevronDown className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800/80 backdrop-blur-sm border-gray-700 text-white" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={route('profile.edit')}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                    {/* Inertia requires a POST request for logout, the `as="button"` handles this */}
                    <Link href={route('logout')} method="post" as="button">
                        Log Out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}