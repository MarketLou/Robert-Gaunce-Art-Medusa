import React from 'react';

// You may need to adjust the props interface based on the data sent from the handler
interface InviteCreatedEmailProps {
  data: {
    user_email: string;
    token: string;
  };
}

const baseUrl = process.env.BACKEND_URL || 'https://xclusive-medusa-production.up.railway.app';

const InviteCreatedEmail = ({ data }: InviteCreatedEmailProps) => {
  const inviteLink = `${baseUrl}/app/invite?token=${data.token}`;

  return (
    <div>
      <h1>You've been invited!</h1>
      <p>Hi there,</p>
      <p>You have been invited to create a user and join the team. Click the link below to set up your account.</p>
      <a href={inviteLink}>Accept Invitation</a>
      <br />
      <p>If you're having trouble, copy and paste this URL into your browser:</p>
      <p>{inviteLink}</p>
      <hr />
      <p>This invitation was intended for {data.user_email}.</p>
    </div>
  );
};

export default InviteCreatedEmail; 