import Head from "next/head";
import { Col, Container, Row } from "react-bootstrap";
import RegisterForm from "../components/Forms/register";

function RegisterPage() {
  return (
    <>
      <Head>
        <title>Forwading Labs - Register</title>
        <meta
          property="og:title"
          content="Forwarding Labs - Register"
          key="title"
        />
      </Head>
      <Container fluid>
        <Row>
          <Col></Col>
          <RegisterForm />
          <Col></Col>
        </Row>
      </Container>
    </>
  );
}

export default RegisterPage;
