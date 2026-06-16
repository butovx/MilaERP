"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CubeIcon, ShoppingCartIcon, QrCodeIcon } from "@heroicons/react/24/outline";

export default function MainNav() {
  const pathname = usePathname();
  
  const links = [
    { href: "/", label: "Главная" },
    { href: "/products", label: "Товары" },
    { href: "/boxes", label: "Коробки" },
    { href: "/scan", label: "Сканер" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-[var(--card-border)] p-4 flex flex-col gap-2">
      <div className="font-bold text-xl mb-4">MILA ERP</div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/5">
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
