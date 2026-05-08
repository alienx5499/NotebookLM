import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@google-cloud/vertexai',
    'google-auth-library',
    '@google/genai',
    'pdf-parse',
    '@qdrant/qdrant-js',
    '@langchain/openai',
    '@langchain/community',
    'langchain',
  ],
};

export default nextConfig;
