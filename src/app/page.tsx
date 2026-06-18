"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CubeIcon,
  QrCodeIcon,
  CubeTransparentIcon,
  ShoppingCartIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { H1, H2, Text, SmallText } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

// Simulated operations data for the chart
const chartData = [
  { name: "Пн", операции: 12, товары: 35 },
  { name: "Вт", операции: 19, товары: 42 },
  { name: "Ср", операции: 15, товары: 38 },
  { name: "Чт", операции: 28, товары: 56 },
  { name: "Пт", операции: 22, товары: 48 },
  { name: "Сб", операции: 8, товары: 24 },
  { name: "Вс", операции: 14, товары: 30 },
];

export default function HomePage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    productsCount: 0,
    boxesCount: 0,
    scansCount: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, boxRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/boxes"),
        ]);
        
        const products = prodRes.ok ? await prodRes.json() : [];
        const boxes = boxRes.ok ? await boxRes.json() : [];
        
        // Calculate scans from localStorage
        let scansCount = 0;
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("scanHistory");
          if (saved) {
            try {
              scansCount = JSON.parse(saved).length;
            } catch (e) {
              console.error(e);
            }
          }
        }

        setStats({
          productsCount: products.length,
          boxesCount: boxes.length,
          scansCount,
          loading: false,
        });
      } catch (err) {
        console.error("Ошибка при загрузке статистики:", err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, []);

  const quickActions = [
    {
      title: "Товары",
      description: "Каталог и управление остатками",
      icon: ShoppingCartIcon,
      link: "/products",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Коробки",
      description: "Упаковка и сортировка грузов",
      icon: CubeTransparentIcon,
      link: "/boxes",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Сканер",
      description: "Распознавание штрих-кодов камерой",
      icon: QrCodeIcon,
      link: "/scan",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Новый товар",
      description: "Быстрое добавление позиции",
      icon: PlusIcon,
      link: "/add-product",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  const recentActivities = [
    { text: "Сканирование штрихкода товара", time: "10 минут назад", type: "scan" },
    { text: "Создана новая коробка BOX-092", time: "1 час назад", type: "box" },
    { text: "Добавлен товар 'Беспроводные наушники'", time: "3 часа назад", type: "product" },
    { text: "Обновлено количество в коробке BOX-081", time: "Вчера", type: "update" },
  ];

  const isDark = theme === "dark";

  return (
    <div className="space-y-6 max-w-[100rem] mx-auto animate-fadeIn">
      {/* Welcome Message */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <H1 className="mb-1">Рабочий стол MilaERP</H1>
          <Text className="text-sm text-[var(--text-color-muted)] mb-0">
            Оперативный мониторинг склада и учет товарно-материальных ценностей в реальном времени.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/scan">
            <Button className="flex items-center gap-2">
              <QrCodeIcon className="h-4 w-4" />
              Быстрое сканирование
            </Button>
          </Link>
        </div>
      </header>

      {/* Dashboard KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:border-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
              Всего товаров
            </CardTitle>
            <ShoppingCartIcon className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.productsCount}</div>
            )}
            <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-1 flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-500" />
              Активные позиции в базе данных
            </SmallText>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
              Всего коробок
            </CardTitle>
            <CubeTransparentIcon className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.boxesCount}</div>
            )}
            <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Задействовано для сортировки
            </SmallText>
          </CardContent>
        </Card>

        <Card className="hover:border-cyan-500/10 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
              Просканировано кодов
            </CardTitle>
            <QrCodeIcon className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.scansCount}</div>
            )}
            <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-1 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              Записи в истории на устройстве
            </SmallText>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Складская активность</CardTitle>
            <CardDescription>Статистика выполнения складских операций за текущую неделю</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#1e293b" : "#e2e8f0"}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f131f" : "#ffffff",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="операции"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <H2 className="text-base font-semibold mb-0 pl-1">Быстрый доступ</H2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.link}>
                <Card className="hover:border-indigo-500/20 transition-all duration-200 cursor-pointer h-full group">
                  <CardContent className="p-4 flex items-center">
                    <div className={`p-2 rounded-lg ${action.bgColor} ${action.color} group-hover:scale-105 transition-transform`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <div className="text-sm font-semibold group-hover:text-indigo-500 transition-colors">
                        {action.title}
                      </div>
                      <div className="text-xs text-[var(--text-color-muted)] truncate">
                        {action.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Log */}
      <Card>
        <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
          <CardTitle className="text-base font-semibold">Журнал последних событий</CardTitle>
          <CardDescription>Автоматически регистрируемые изменения и действия пользователей</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--card-border)]">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <div className="text-sm font-medium text-[var(--text-color-secondary)]">
                    {act.text}
                  </div>
                </div>
                <div className="text-xs text-[var(--text-color-muted)]">
                  {act.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
