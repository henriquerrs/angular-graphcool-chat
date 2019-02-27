import { default as Graphcool, fromEvent, FunctionEvent } from 'graphcool-lib';
import { GraphQLClient } from 'graphql-request';
import * as bcrypt from 'bcryptjs';

interface User {
  id: string;
  password: string;
}

interface EventData {
  email: string;
  password: string;
}

const SALT_ROUNDS = 10;

export default async (event: FunctionEvent<EventData>) => {
  console.log(event);

  try {
    const graphcool: Graphcool = fromEvent<EventData>(event);
    const api = graphcool.api('simple/v1');

    const { email, password } = event.data;

    // get user by email
    const user: User = await getUserByEmail(api, email)
      .then(r => r.User);

    // no user with this email
    if (!user) {
      return { error: 'Credenciais inválidas!' };
    }

    // check password
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    if (!passwordIsCorrect) {
      return { error: 'Credenciais inválidas!' };
    }

    // generate node token for existing User node
    const token = await graphcool.generateNodeToken(user.id, 'User');

    return { data: { id: user.id, token} };
  } catch (e) {
    console.log(e);
    return { error: 'Um erro inesperado aconteceu durante a autenticação.' };
  }
};

async function getUserByEmail(api: GraphQLClient, email: string): Promise<{ User }> {
  const query = `
    query getUserByEmail($email: String!) {
      User(email: $email) {
        id
        password
      }
    }
  `;

  const variables = {
    email,
  };

  return api.request<{ User }>(query, variables);
}
