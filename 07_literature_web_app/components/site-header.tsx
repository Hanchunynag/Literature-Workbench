import Link from "next/link";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/library", label: "文献库" },
  { href: "/upload", label: "上传处理" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/">
          <span className="brand-badge">LW</span>
          <div>
            <p>Literature Workbench</p>
            <span>个人文献工作台</span>
          </div>
        </Link>

        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
