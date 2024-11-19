import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing
  },
};

const handler = async (req, res) => {
  const logData = {
    method: req.method,
    headers: req.headers,
    authorization: req.headers.authorization || 'Not provided',
    conversation_id: req.headers.conversation_id || 'Not provided',
    body: null,
  };

  try {
    console.log('Request Method:', req.method);
    console.log('Request Headers:', req.headers);

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    console.log('Raw Body:', rawBody);

    if (!rawBody.trim()) {
      logData.body = 'No body provided';
      console.log('Request Log:', logData);
      res.status(400).json({ error: 'Empty request body' });
      return;
    }

    try {
      logData.body = JSON.parse(rawBody);
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
