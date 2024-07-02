import NavGroup from "../molecules/nav-group";
import { ChevronDown, Github } from "lucide-react";

import { useMemo, useState } from "react";

const Header = ({ className }: { className?: string }) => {
  const [segment, setSegments] = useState<number>(0);

  const navs = useMemo(
    () => [
      {
        title: "Feed",
        value: "feed",
        href: "/",
        isActive: segment === 0,
      },
      {
        title: "Proposals",
        value: "proposals",
        href: "/proposals",
        isActive: segment === 1,
      },
      {
        title: "Docs",
        value: "docs",
        href: "/documentation",
        isActive: segment === 2,
      },
    ],
    [segment]
  );

  return (
    <div
      className={` flex justify-between items-center px-4 min-h-[70px] bg-transparent pr-8 ${className}`}
    >
      <a
        className="flex space-x-2 text-md"
        target="_blank"
        href="https://github.com/acgodson/clanopedia"
      >
        <Github />
        <p className="">Source</p>
      </a>

      <NavGroup navs={navs} />
    </div>
  );
};

export default Header;
