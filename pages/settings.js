import React from 'react';
import Layout from '../components/Layout';

const AccountSettings = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Account Settings</h1>

        {/* Change Password Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <form>
            <div className="mb-4">
                <p>Password Form will go here</p>
            </div>
          </form>
        </section>

        {/* Add other settings sections here */}

      </div>
    </Layout>
  );
};

export default AccountSettings;