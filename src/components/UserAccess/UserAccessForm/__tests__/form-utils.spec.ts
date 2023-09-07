import { k8sCreateResource, k8sPatchResource } from '@openshift/dynamic-plugin-sdk-utils';
import '@testing-library/jest-dom';
import { createSBRs, editSBR } from '../form-utils';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  k8sPatchResource: jest.fn(),
  k8sCreateResource: jest.fn(),
}));

const k8sCreateMock = k8sCreateResource as jest.Mock;
const k8sPatchMock = k8sPatchResource as jest.Mock;

describe('createSBRs', () => {
  it('should create SBRs for all usernames', async () => {
    k8sCreateMock.mockImplementation((obj) => obj.resource);
    const result = await createSBRs(
      { usernames: ['user1', 'user2', 'user3'], role: 'maintainer' },
      'test-ns',
    );

    expect(k8sCreateMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual([
      expect.objectContaining({
        metadata: { generateName: 'user1-', namespace: 'test-ns' },
        spec: { masterUserRecord: 'user1', spaceRole: 'maintainer' },
      }),
      expect.objectContaining({
        metadata: { generateName: 'user2-', namespace: 'test-ns' },
        spec: { masterUserRecord: 'user2', spaceRole: 'maintainer' },
      }),
      expect.objectContaining({
        metadata: { generateName: 'user3-', namespace: 'test-ns' },
        spec: { masterUserRecord: 'user3', spaceRole: 'maintainer' },
      }),
    ]);
  });
});

describe('editSBR', () => {
  it('should patch SBR with new role', async () => {
    k8sPatchMock.mockResolvedValue({});
    const result = await editSBR(
      { usernames: ['user1'], role: 'contributor' },
      {
        apiVersion: 'v1alpha1',
        kind: 'SpaceBindingRequest',
        metadata: { name: 'user1' },
        spec: { masterUserRecord: 'user1', spaceRole: 'maintainer' },
      },
    );
    expect(result).toEqual([{}]);
    expect(k8sPatchMock).toHaveBeenCalledTimes(1);
    expect(k8sPatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [{ op: 'replace', path: '/spec/spaceRole', value: 'contributor' }],
      }),
    );
  });
});
