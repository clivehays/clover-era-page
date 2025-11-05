// Vercel serverless function to serve IndexNow key file
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('06df42ece6db4d3e824d304653bb7a47');
}
