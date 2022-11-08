import Link from "next/link";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import style from "./register.module.css";

function RegisterForm() {
  return (
    <Col sm={10} lg={4} className={style.form}>
      <h1 className={style.heading}>Register</h1>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="E.g. john123" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>E-mail address</Form.Label>
          <Form.Control type="text" placeholder="E.g. john.smith@email.com" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Repeat Password</Form.Label>
          <Form.Control type="repeat-password" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label={
              <p>
                I read and accept{" "}
                <Link href="/tos" passHref>
                  <a>terms of service</a>
                </Link>
                .
              </p>
            }
          />
        </Form.Group>
        <Button variant="secondary" type="submit">
          Submit
        </Button>
      </Form>
    </Col>
  );
}

export default RegisterForm;
