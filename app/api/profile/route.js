// app/api/attendance/route.js
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
            status: 401,
        });
    }

    const apiUrl = `https://api.diu.edu.bd/api/ess/portal/employee/information/profile`;

    try {
        const res = await fetch(apiUrl, {
            headers: {
                Authorization: `${token}`,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return new Response(
                JSON.stringify({ error: "DIU API fetch failed" }),
                {
                    status: res.status,
                }
            );
        }

        const data = await res.json();
        return Response.json(data);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
}
