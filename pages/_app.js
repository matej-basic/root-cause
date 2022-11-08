import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import SSRProvider from "react-bootstrap/SSRProvider";
import Layout from "../components/Layout/layout";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <SSRProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SSRProvider>
  );
}

export default MyApp;
