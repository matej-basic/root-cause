import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import style from "./reset-password.module.css";

function ResetPassword() {
  return (
    <Col sm={10} lg={4} className={style.form}>
      <h1 className={style.heading}>Reset password</h1>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Enter your e-mail address</Form.Label>
          <Form.Control type="text" placeholder="E.g. john.smith@email.com" />
        </Form.Group>
        <Button variant="secondary" type="submit" className={style.submit}>
          Submit
        </Button>
      </Form>
    </Col>
  );
}

export default ResetPassword;
