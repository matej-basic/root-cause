import Link from "next/link";
import { Button, Col, Form } from "react-bootstrap";
import style from "./login.module.css";

function LoginFrom() {
  return (
    <Col sm={10} lg={4} className={style.form}>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="E.g. john123" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" />
          <Form.Text className="text-muted">
            <Link href="reset-password" passhref>
              <a>Forgot your password?</a>
            </Link>
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check type="checkbox" label="Stay logged in" />
        </Form.Group>
        <Button variant="secondary" type="submit">
          Submit
        </Button>
      </Form>
    </Col>
  );
}

export default LoginFrom;
