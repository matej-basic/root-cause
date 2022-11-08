import Head from "next/head";
import { Col, Container, Row } from "react-bootstrap";
import LoginFrom from "../components/Forms/login";

function LoginPage() {
  return (
    <>
      <Head>
        <title>Forwading Labs - Login</title>
        <meta
          property="og:title"
          content="Forwarding Labs - Login"
          key="title"
        />
      </Head>
      <Container fluid>
        <Row>
          <Col></Col>
          <LoginFrom />
          <Col></Col>
        </Row>
      </Container>
    </>
  );
}

export default LoginPage;
