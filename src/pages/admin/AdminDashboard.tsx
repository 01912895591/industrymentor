import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

                // If finance_transactions table doesn't exist yet or fails, we fail gracefully
                if (salesError && salesError.code === "42P01") {
                    console.log("Finance transactions table missing, skipping");
                }


                setStats({
                    revenue: totalRevenue,
                    students: studentCount || 0,
                    courses: courseCount || 0,
                    enrollments: enrollmentCount || 0
                });
                setChartData(chart.length > 0 ? chart : [{ name: "No Data", total: 0 }]);
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
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Overview of your platform's performance</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-200 border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime earnings
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-primary/10 bg-gradient-to-br from-card to-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.students}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered users
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-primary/10 bg-gradient-to-br from-card to-orange-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.courses}</div>
                        <p className="text-xs text-muted-foreground">
                            Published courses
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-primary/10 bg-gradient-to-br from-card to-purple-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.enrollments}</div>
                        <p className="text-xs text-muted-foreground">
                            Course signups
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `৳${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Latest income transactions.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentSales.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent sales found.</p>
                            ) : (
                                recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            $
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{sale.description || "Course Sale"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">+৳{sale.amount}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
