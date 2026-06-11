export async function getBoardCards() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!key || !token || !boardId) {
    throw new Error("Missing Trello environment variables");
  }

  const url = `https://api.trello.com/1/boards/${boardId}/cards?key=${key}&token=${token}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Trello error ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}