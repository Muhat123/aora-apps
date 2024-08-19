import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.laatansa.aora",
  projectId: "66c07a8d002bb4245166",
  databaseID: "66c089da003e163eba92",
  userCollectionId: "66c089f4002b96015a39",
  videoCollectionId: "66c08a1d000c2fa8df79",
  storageId: "66c08b8d002ac7a373fb",
};

const {
    endpoint,
    platform,
    projectId,
    databaseID,
    userCollectionId,
    videoCollectionId,
    storageId
  } = appwriteConfig;

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    if (!newAccount) throw Error;
    const avatarUrl = avatars.getInitials(username);
    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      }
    );
    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export async function signIn(email, password) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export const getCurrentUser = async () => {
    try {
      const currentAccount = await account.get();
       if(!currentAccount) throw new Error;
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )
        if(!currentUser) throw new Error;
        return currentUser.documents[0];
    } catch (error) {
      console.log(error);
    }
  
}

export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseID,
            videoCollectionId,
            [Query.orderDesc('$createdAt')]

        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const getLatestPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseID,
            videoCollectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]

        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const searchPosts = async (query) => {
  try {
      const posts = await databases.listDocuments(
          databaseID,
          videoCollectionId,
          [Query.search('title', query)]

      )
      return posts.documents
  } catch (error) {
      throw new Error(error)
  }
}

export const getUserPosts = async (userId) => {
  try {
      const posts = await databases.listDocuments(
          databaseID,
          videoCollectionId,
          [Query.equal('creator', userId), Query.orderDesc('$createdAt', Query.limit(7))]

      )
      return posts.documents
  } catch (error) {
      throw new Error(error)
  }
}

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current')
    return session;
  } catch (error) {
    throw new Error(error)
    
  }
}

export const getFilePreview = async (fileId, type) => {
  let fileUrl;

  try {
    if(type === 'video'){
      fileUrl = storage.getFileView(storageId, fileId)
    }else if (type === 'image'){
      fileUrl = storage.getFilePreview(storageId, fileId, 2000,2000,'top', 100)
    }else{
      throw new Error('Invalid file type')
    }

    if(!fileUrl) throw new Error;
    return fileUrl;
  } catch (error) {
    throw new Error(error)
  }


}

export const uploadFile = async (file, type) => {
  if(!file) return;

  const { mimeType, ...rest} = file;
  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri
  };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );


    const fileUrl = await getFilePreview(uploadedFile.$id, type)
    return fileUrl
  } catch (error) {
    throw new Error(error)
  }
}


export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video'),
    ])

    const newPost = await databases.createDocument(
      databaseID,videoCollectionId, ID.unique(), {
        title: form.title,
        prompt: form.prompt,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        creator: form.userId,
      }
    )
    return newPost;
  } catch (error) {
    throw new Error(error);
  }

}

