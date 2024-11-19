import { Readable } from 'stream';

const handler = async (req, res) => {
  // Initialize a raw log data object
  const logData = {
    method: req.method,
    headers: req.headers,
    body: null,
  };

  try {
    // Buffer the request body synchronously
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    logData.body = Buffer.concat(buffers).toString() || 'No body provided';

    // Log the raw request
    console.log('Raw Request Log:', JSON.stringify(logData, null, 2));

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Create a readable stream for the response
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
  } catch (error) {
    // Handle and log any errors
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
