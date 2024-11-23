import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import supabase from "../lib/createClient";

interface NavbarProps {
  fullName: string;
}

const Navbar = ({ fullName }: NavbarProps) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  };

  const getRandomColor = () => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <nav className="w-full p-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={`${getRandomColor()} h-10 w-10 rounded-full`}
              variant="ghost"
            >
              {getInitials(fullName)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
