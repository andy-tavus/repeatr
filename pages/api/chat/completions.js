import { Readable } from 'stream';

const handler = async (req, res) => {
  const logData = {
    authorization: req.headers.authorization || 'Not provided',
    conversation_id: req.headers.conversation_id || 'Not provided',
    body: null,
  };

  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();

    try {
      logData.body = JSON.parse(rawBody); // Parse the JSON body
    } catch (error) {
      logData.body = `Invalid JSON: ${rawBody}`;
    }

    console.log('Request Log:', logData);

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const stream = new Readable({
      read() {
        this.push(
          `data: ${JSON.stringify({
            choices: [
              {
                delta: { role: 'assistant', content: 'I say this every time.' },
              },
            ],
          })}\n\n`
        );
        this.push('data: [DONE]\n\n');
        this.push(null);
      },
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    stream.pipe(res);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
