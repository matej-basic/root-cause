import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import Layout from "../components/Layout/layout";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
