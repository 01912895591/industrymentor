import { Card } from "@/components/ui/card";
import {
    Users,
    BookOpen,
    DollarSign,
    TrendingUp,
    Activity
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        students: 0,
        courses: 0,
        enrollments: 0
    });
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Revenue (sum of income transactions)
                const { data: transactions } = await (supabase as any)
                    .from("finance_transactions")
                    .select("amount, created_at")
                    .eq("type", "income")
                    .order("created_at", { ascending: true }); // Ordered for chart

                const totalRevenue = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

                // Prepare chart data (group by month)
                const monthlyData: Record<string, number> = {};
                transactions?.forEach((t: any) => {
                    const date = new Date(t.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });
                    monthlyData[month] = (monthlyData[month] || 0) + t.amount;
                });
                const chart = Object.keys(monthlyData).map(key => ({ name: key, total: monthlyData[key] }));

                // 2. Fetch Active Students (count profiles)
                const { count: studentCount } = await (supabase as any)
                    .from("profiles")
                    .select("*", { count: "exact", head: true });

                // 3. Fetch Active Courses (count published courses)
                const { count: courseCount } = await supabase
                    .from("courses")
                    .select("*", { count: "exact", head: true })
                    .eq("published", true);

                // 4. Fetch Total Enrollments
                const { count: enrollmentCount } = await supabase
                    .from("course_enrollments")
                    .select("*", { count: "exact", head: true });

                // 5. Fetch Recent Sales
                const { data: sales, error: salesError } = await (supabase as any)
                    .from("finance_transactions")
                    .select("*, profiles(full_name)")
                    .eq("type", "income")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (salesError && salesError.code === "42P01") {
                    console.log("Finance transactions table missing, skipping");
                }

                setStats({
                    revenue: totalRevenue,
                    students: studentCount || 0,
                    courses: courseCount || 0,
                    enrollments: enrollmentCount || 0
                });
                setChartData(chart);
                setRecentSales(sales || []);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-3.5 animate-fade-in">
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-xs text-muted-foreground">Overview of your platform's performance</p>
                </div>
            </div>

            {/* Compact Stat Cards Grid */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs hover:border-primary/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-xl font-bold tracking-tight">৳{stats.revenue.toLocaleString()}</div>
                        <span className="text-[11px] text-muted-foreground">Lifetime</span>
                    </div>
                </Card>

                <Card className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs hover:border-primary/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Active Students</span>
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-xl font-bold tracking-tight">{stats.students}</div>
                        <span className="text-[11px] text-muted-foreground">Registered</span>
                    </div>
                </Card>

                <Card className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs hover:border-primary/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Active Courses</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <BookOpen className="h-4 w-4 text-emerald-500" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-xl font-bold tracking-tight">{stats.courses}</div>
                        <span className="text-[11px] text-muted-foreground">Published</span>
                    </div>
                </Card>

                <Card className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-2xs hover:border-primary/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Total Enrollments</span>
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-xl font-bold tracking-tight">{stats.enrollments}</div>
                        <span className="text-[11px] text-muted-foreground">Signups</span>
                    </div>
                </Card>
            </div>

            {/* Charts & Recent Activity Section */}
            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 rounded-xl border border-border/60 bg-card/60 shadow-2xs p-3.5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold">Revenue Overview</h3>
                    </div>
                    <div>
                        {chartData.length === 0 ? (
                            <div className="h-[210px] flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/40 rounded-lg">
                                <TrendingUp className="h-7 w-7 text-muted-foreground/40 mb-1.5" />
                                <p className="text-xs font-semibold text-foreground">No revenue activity recorded yet</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                                    Revenue trends will automatically populate here as course enrollments are completed.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[210px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `৳${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: "6px",
                                                border: "1px solid hsl(var(--border))",
                                                backgroundColor: "hsl(var(--card))",
                                                fontSize: "12px",
                                                padding: "6px 10px",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorTotal)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="col-span-3 rounded-xl border border-border/60 bg-card/60 shadow-2xs p-3.5">
                    <div className="mb-2">
                        <h3 className="text-sm font-bold">Recent Sales</h3>
                        <p className="text-[11px] text-muted-foreground">Latest income transactions</p>
                    </div>
                    <div>
                        {recentSales.length === 0 ? (
                            <div className="h-[210px] flex items-center justify-center border border-dashed border-border/40 rounded-lg">
                                <p className="text-xs text-muted-foreground text-center">No recent sales found.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                ৳
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold leading-none truncate">{sale.description || "Course Sale"}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {new Date(sale.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-xs text-emerald-500 shrink-0">+৳{sale.amount}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
