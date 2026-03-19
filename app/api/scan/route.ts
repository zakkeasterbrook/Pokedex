export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  // 🔥 TEMP: fake detection
  return Response.json({
    card_id: "bandai-1996-001",
  });
}