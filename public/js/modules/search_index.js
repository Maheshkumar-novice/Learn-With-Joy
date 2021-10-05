export const client = new Typesense.Client({
  nodes: [
    {
      host: "tfdion2suw4ygle7p-1.a1.typesense.net",
      port: "443",
      protocol: "https",
    },
  ],
  apiKey: "viiz4fUTcJVHZmQ8GTQHmHlgjAxVozdg",
  connectionTimeoutSeconds: 2,
});

export const chatMessageCollection = {
  name: "chat",
  fields: [
    { name: "chat_hash", type: "string" },
    { name: "message_id", type: "string" },
    { name: "text", type: "string" },
    { name: "timestamp", type: "int64" },
  ],
  'default_sorting_field': 'timestamp'
};

export async function chatSearchResult(query, chatHash) {
  const searchParameters = {
    q: query,
    query_by: "text",
    filter_by: `chat_hash: ${chatHash}`,
    sort_by   : 'timestamp:desc',
    prefix: false,
    num_typos: 0,
    typo_tokens_threshold: 0,
    highlight_start_tag: `<span class="yellow">`,
    highlight_end_tag: "</span>"
  };
  return (await client.collections('chat').documents().search(searchParameters));
}