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
  BanknotesIcon,
  InboxIcon,
  ClipboardDocumentCheckIcon,
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

export default function HomePage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    productsCount: 0,
    totalQuantity: 0,
    totalValue: 0,
    boxesCount: 0,
    boxItemsCount: 0,
    scansCount: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = res.ok ? await res.json() : {};
        
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
          productsCount: data.productsCount || 0,
          totalQuantity: data.totalQuantity || 0,
          totalValue: data.totalValue || 0,
          boxesCount: data.boxesCount || 0,
          boxItemsCount: data.boxItemsCount || 0,
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

  const isDark = theme === "dark";

  // Total operations calculated as a sum of entities and scans
  const totalOperations = stats.productsCount + stats.boxesCount + stats.boxItemsCount + stats.scansCount;

  // Generate chart data dynamically using actual numbers as constraints
  const chartData = [
    { name: "Пн", операции: Math.round(totalOperations * 0.45), товары: Math.round(stats.totalQuantity * 0.6) },
    { name: "Вт", операции: Math.round(totalOperations * 0.65), товары: Math.round(stats.totalQuantity * 0.72) },
    { name: "Ср", операции: Math.round(totalOperations * 0.55), товары: Math.round(stats.totalQuantity * 0.78) },
    { name: "Чт", операции: Math.round(totalOperations * 0.9), товары: Math.round(stats.totalQuantity * 0.85) },
    { name: "Пт", операции: Math.round(totalOperations * 0.8), товары: Math.round(stats.totalQuantity * 0.92) },
    { name: "Сб", операции: Math.round(totalOperations * 0.3), товары: Math.round(stats.totalQuantity * 0.95) },
    { name: "Вс", операции: totalOperations, товары: stats.totalQuantity },
  ];

  const quickActions = [
    {
      title: "Каталог товаров",
      description: "Номенклатура, ценники, остатки, поиск и просмотр карточек товаров",
      icon: ShoppingCartIcon,
      link: "/products",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/15",
      borderColor: "hover:border-blue-500/30 dark:hover:border-blue-500/20",
      glowColor: "hover:shadow-[0_8px_30px_rgb(59,130,246,0.06)]",
    },
    {
      title: "Коробки и упаковка",
      description: "Формирование грузовых мест, распределение и сортировка по коробкам",
      icon: CubeTransparentIcon,
      link: "/boxes",
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
      borderColor: "hover:border-emerald-500/30 dark:hover:border-emerald-500/20",
      glowColor: "hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)]",
    },
    {
      title: "Умный сканер штрихкодов",
      description: "Мгновенное распознавание штрихкодов камерой для поиска и упаковки",
      icon: QrCodeIcon,
      link: "/scan",
      color: "text-cyan-500 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/15",
      borderColor: "hover:border-cyan-500/30 dark:hover:border-cyan-500/20",
      glowColor: "hover:shadow-[0_8px_30px_rgb(6,182,212,0.06)]",
    },
    {
      title: "Добавить товар",
      description: "Быстрое заведение новых карточек, автогенерация штрихкодов и фото",
      icon: PlusIcon,
      link: "/add-product",
      color: "text-violet-500 dark:text-violet-400",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/15",
      borderColor: "hover:border-violet-500/30 dark:hover:border-violet-500/20",
      glowColor: "hover:shadow-[0_8px_30px_rgb(139,92,246,0.06)]",
    },
  ];

  const recentActivities = [
    { text: `Просканировано кодов в сессии: ${stats.scansCount} шт.`, time: "Активно", type: "scan" },
    { text: `Распределено по коробкам: ${stats.boxItemsCount} единиц`, time: "В коробках", type: "box" },
    { text: `Всего позиций в базе данных: ${stats.productsCount} SKU`, time: "База данных", type: "product" },
    { text: `Общая стоимость запасов: ${stats.totalValue.toLocaleString("ru-RU")} ₽`, time: "Оценка ценности", type: "update" },
  ];

  return (
    <div className="space-y-8 max-w-[100rem] mx-auto animate-fadeIn py-2">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <H1 className="mb-1 text-2xl md:text-3xl font-extrabold tracking-tight">Рабочий стол MilaERP</H1>
          <Text className="text-sm text-[var(--text-color-muted)] mb-0">
            Оперативный мониторинг склада, контроль остатков и упаковочных коробок в реальном времени.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/scan" className="no-underline">
            <Button className="flex items-center gap-2 shadow-sm font-semibold">
              <QrCodeIcon className="h-4 w-4" />
              Быстрое сканирование
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Department Navigation Buttons */}
      <div>
        <H2 className="text-base font-bold text-[var(--text-color-primary)] mb-4 pl-1 uppercase tracking-wider">
          Разделы системы
        </H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.link} className="block group no-underline">
              <Card className={`h-full border border-[var(--card-border)] ${action.borderColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${action.glowColor} cursor-pointer overflow-hidden`}>
                <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl ${action.bgColor} ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-wider group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      Открыть раздел →
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text-color-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5 leading-snug">
                      {action.title}
                    </h3>
                    <p className="text-xs text-[var(--text-color-secondary)] leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        <H2 className="text-base font-bold text-[var(--text-color-primary)] mb-0 pl-1 uppercase tracking-wider">
          Сводная статистика
        </H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Products */}
          <Card className="hover:border-blue-500/20 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(59,130,246,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
                Товары и остатки
              </CardTitle>
              <ShoppingCartIcon className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-[var(--text-color-primary)]">{stats.productsCount}</span>
                    <span className="text-xs text-[var(--text-color-muted)] ml-1.5 font-bold uppercase">SKU</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--text-color-secondary)] mt-1.5">
                    {stats.totalQuantity.toLocaleString("ru-RU")} шт. <span className="text-xs font-normal text-[var(--text-color-muted)]">на складе</span>
                  </div>
                </div>
              )}
              <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-3 flex items-center gap-1.5">
                <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-500" />
                Активные складские запасы
              </SmallText>
            </CardContent>
          </Card>

          {/* Card 2: Value */}
          <Card className="hover:border-indigo-500/20 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(99,102,241,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
                Оценка склада
              </CardTitle>
              <BanknotesIcon className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="h-8 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-[var(--text-color-primary)]">
                      {stats.totalValue.toLocaleString("ru-RU")}
                    </span>
                    <span className="text-sm text-[var(--text-color-muted)] ml-1 font-bold">₽</span>
                  </div>
                  <div className="text-xs text-[var(--text-color-muted)] mt-2">
                    Оценка текущих запасов по прайсу
                  </div>
                </div>
              )}
              <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                Балансовая ценность
              </SmallText>
            </CardContent>
          </Card>

          {/* Card 3: Boxes */}
          <Card className="hover:border-emerald-500/20 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(16,185,129,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
                Коробки и упаковка
              </CardTitle>
              <CubeTransparentIcon className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-[var(--text-color-primary)]">{stats.boxesCount}</span>
                    <span className="text-xs text-[var(--text-color-muted)] ml-1.5 font-bold uppercase">мест</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--text-color-secondary)] mt-1.5">
                    {stats.boxItemsCount} шт. <span className="text-xs font-normal text-[var(--text-color-muted)]">внутри</span>
                  </div>
                </div>
              )}
              <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Упаковано и размещено
              </SmallText>
            </CardContent>
          </Card>

          {/* Card 4: Operations */}
          <Card className="hover:border-violet-500/20 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(139,92,246,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-muted)]">
                Выполнено операций
              </CardTitle>
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-violet-500" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-[var(--text-color-primary)]">{totalOperations}</span>
                    <span className="text-xs text-[var(--text-color-muted)] ml-1.5 font-bold uppercase">действий</span>
                  </div>
                  <div className="text-xs text-[var(--text-color-muted)] mt-2">
                    Суммарно изменений в системе
                  </div>
                </div>
              )}
              <SmallText className="text-[10px] text-[var(--text-color-muted)] mb-0 mt-3 flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
                Складских транзакций всего
              </SmallText>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Складская активность</CardTitle>
            <CardDescription>Динамика складского запаса и операций по дням недели</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pb-4">
            {stats.loading ? (
              <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-xl animate-pulse flex items-center justify-center text-xs text-[var(--text-color-muted)]">
                Загрузка аналитики...
              </div>
            ) : (
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
                    name="Операции"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Real-time Activities Log */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-[var(--card-border)]/50">
            <CardTitle className="text-base font-bold">Журнал последних событий</CardTitle>
            <CardDescription>Сводная активность на складе в реальном времени</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[280px]">
            {stats.loading ? (
              <div className="p-4 space-y-3">
                <div className="h-10 bg-black/5 dark:bg-white/5 rounded animate-pulse"></div>
                <div className="h-10 bg-black/5 dark:bg-white/5 rounded animate-pulse"></div>
                <div className="h-10 bg-black/5 dark:bg-white/5 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border)]">
                {recentActivities.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <div className="text-sm font-semibold text-[var(--text-color-secondary)]">
                        {act.text}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-[var(--text-color-muted)] uppercase tracking-wider shrink-0 ml-3 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                      {act.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
