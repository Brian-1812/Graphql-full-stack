import React from "react";
import { NextPage } from "next";
import { Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";

const ResetPassword: NextPage<{ token: string }> = ({ token }) => {
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          // const response = await login(values);
          // if (response.data?.login.errors)
          //   setErrors(toErrorMap(response.data.login.errors));
          // else if (response.data?.login.user) {
          //   router.push("/");
          // }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              label="New Password"
              placeholder="New password"
            />
            <Button
              mt={4}
              colorScheme="teal"
              type="submit"
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ResetPassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default ResetPassword;
