import Head from "next/head";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import ResetPassword from "../components/Forms/reset-password";

function ForgotPasswordPage() {
  return (
    <>
      <Head>
        <title>Forwading Labs - Forgot password</title>
        <meta
          property="og:title"
          content="Forwarding Labs - Forgot password"
          key="title"
        />
      </Head>
      <Container fluid>
        <Row>
          <Col></Col>
          <ResetPassword />
          <Col></Col>
        </Row>
      </Container>
    </>
  );
}

export default ForgotPasswordPage;
