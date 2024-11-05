import { useEffect, useState } from 'react';

// Import env var
import { TOKEN as VITE_TOKEN } from '../ts/apiConfig';

const ENV = import.meta.env;

const useFetchToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = () => {
      if (ENV.DEV) {
        setToken(VITE_TOKEN);
        console.log('ENV.VITE_TOKEN:', VITE_TOKEN);
        console.log("Running development");
      } else {
        console.log("Running production");
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get('token');
        if (tokenFromUrl !== null) {
          setToken(tokenFromUrl);
        } else {
          console.log("Token not found in URL");
          setToken('');
        }
      }
    };

    fetchToken();
  }, []);

  return token;
};

export default useFetchToken;
