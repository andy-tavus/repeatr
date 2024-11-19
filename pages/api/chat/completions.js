import { Readable } from 'stream';

const handler = async (req, res) => {
  const logData = {
    method: req.method,
    headers: req.headers,
    body: '',
  };

  try {
    // Stream and log incoming request body incrementally
    req.on('data', (chunk) => {
      logData.body += chunk.toString(); // Append chunks to the body string
    });

    req.on('end', () => {
      // Log the full request when streaming ends
      console.log('Raw Request Log:', JSON.stringify(logData, null, 2));

      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }

      // Start streaming response
      const stream = new Readable({
        read() {
          // Send the initial message
          this.push(
            `data: ${JSON.stringify({
              choices: [
                {
                  delta: { role: 'assistant', content: 'I say this every time.' },
                },
              ],
            })}\n\n`
          );
          // Signal the end of the stream
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
    });

    req.on('error', (err) => {
      console.error('Error reading request stream:', err);
      res.status(500).json({ error: 'Error reading request stream' });
    });
  } catch (error) {
    // Handle errors
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
