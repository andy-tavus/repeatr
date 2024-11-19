import { Readable } from 'stream';

const handler = async (req, res) => {
  // Initialize an object to collect log data
  const logData = {
    authorization: req.headers.authorization || 'Not provided',
    conversation_id: req.headers.conversation_id || 'Not provided',
    body: null,
  };

  // Buffer the incoming request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // Convert Buffer to string
  });

  req.on('end', () => {
    logData.body = body || 'No body provided';

    // Log everything in one console.log statement
    console.log('Request Log:', logData);
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
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
    // Handle any errors
    console.error('Error in handler:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handler;
