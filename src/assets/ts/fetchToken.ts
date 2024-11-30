import { useEffect, useState } from 'react';

// Import env var
import { TOKEN as VITE_TOKEN } from '../ts/apiConfig';

const ENV = import.meta.env;
console.log("ENV", ENV);
console.log("ENV.MODE", ENV.MODE);

if (ENV.VITE_MODE === 'production') {
  console.log('Simulating production mode in dev');
}


const useFetchToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = () => {
      if (ENV.MODE === "development") {
        setToken(VITE_TOKEN);
        console.log('ENV.VITE_TOKEN:', VITE_TOKEN);
        console.log("Running development");
      } else {
        console.log("Running production");
        const queryParams = new URLSearchParams(window.location.search);
        console.log("queryParams", queryParams);
        const tokenFromUrl = queryParams.get('token');
        console.log("tokenFromUrl", tokenFromUrl);
        if (tokenFromUrl !== null) {
          setToken(tokenFromUrl);
          console.log("Token set in production mode")
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
