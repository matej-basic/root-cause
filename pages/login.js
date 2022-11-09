import Head from "next/head";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
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
