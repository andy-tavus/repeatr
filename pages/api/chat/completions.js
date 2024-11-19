import { Readable } from 'stream';

const handler = async (req, res) => {
  const logData = {
    method: req.method,
    headers: req.headers,
    body: '',
  };

  try {
    // Read incoming chunks with a timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 9000)
    );

    const readStream = new Promise((resolve, reject) => {
      req.on('data', (chunk) => {
        logData.body += chunk.toString(); // Append chunk to body
      });

      req.on('end', () => {
        resolve();
      });

      req.on('error', (err) => {
        reject(err);
      });
    });

    // Wait for the input stream or timeout
    await Promise.race([readStream, timeout]);

    // Log the full request after streaming ends
    console.log('Raw Request Log:', JSON.stringify(logData, null, 2));

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Respond immediately for streaming input
    const stream = new Readable({
      read() {
        this.push(
          `data: ${JSON.stringify({
            choices: [
              {
                delta: { role: 'assistant', content: 'Response is streaming fine.' },
              },
            ],
          })}\n\n`
        );
        this.push('data: [DONE]\n\n');
        this.push(null); // End the stream
      },
    });

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the stream to the response
    stream.pipe(res);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
